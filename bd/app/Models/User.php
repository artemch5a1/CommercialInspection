<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;  // <-- ДОБАВЬТЕ ЭТУ СТРОКУ

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;  // <-- ДОБАВЬТЕ HasApiTokens СЮДА

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    protected $fillable = [
        'login',
        'password',
        'surname',
        'name',
        'patronymic',
        'pol',
        'level',
        'group_id',
        'profession_id',
        'role',
        'foundDefects'  // <-- ДОБАВЬТЕ ЭТО ПОЛЕ
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function profession()
    {
        return $this->belongsTo(Profession::class);
    }

    public function statistics()
    {
        return $this->hasMany(Statistic::class);
    }

    public function findFaults()
    {
        return $this->hasMany(Find_fault::class);
    }
}
