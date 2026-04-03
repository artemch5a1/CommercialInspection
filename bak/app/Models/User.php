<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

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
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'surname',
        'patronymic',
        'login',
        'password',
        'pol',
        'id_group',
        'id_profession',
        'role',
        'id_statistics'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class, 'id_group');
    }

    public function profession()
    {
        return $this->belongsTo(Profession::class, 'id_profession');
    }

    public function statistics()
    {
        return $this->hasMany(Statistic::class, 'id_user');
    }
}
